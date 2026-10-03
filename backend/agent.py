"""
Rule-based support agent for Aura Skincare. No LLM, no external API.

respond(text, context) -> {reply, context, intent, tool_calls}
The server is stateless: the browser sends back the `context` dict it got last turn.
"""
import copy
import re

from orders import cancel_order, get_order_details

# ---------- small helpers ----------

NUMBER_WORDS = {
    "zero": "0", "oh": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
}
_NUM = "(?:" + "|".join(NUMBER_WORDS) + ")"


def words_to_digits(t):
    """'order one zero one' -> 'order 101', 'o r d 101' -> 'ord 101'"""
    t = re.sub(r"\bo\s+r\s+d\b", "ord", t)
    return re.sub(
        rf"\b{_NUM}(?:\s+{_NUM})*\b",
        lambda m: "".join(NUMBER_WORDS[w] for w in m.group(0).split()),
        t,
    )


def spell(s):
    """'ORD-101' -> 'O R D 1 0 1' so the voice reads it clearly"""
    return " ".join(c for c in str(s) if c != "-")


def extract_order_id(t, awaiting_id):
    m = re.search(r"\b(?:ord|order)(?:\W+(?:id|number|no|is|of|for))*\W*(\d(?:[\s-]?\d){0,5})", t)
    if m:
        return "ORD-" + re.sub(r"\D", "", m.group(1)), True
    if awaiting_id:  # they were asked for the ID, so a bare number is probably it
        m = re.search(r"\b(\d(?:[\s-]?\d){1,5})\b", t)
        if m:
            return "ORD-" + re.sub(r"\D", "", m.group(1)), True
    return None, False


def extract_days(t):
    m = re.search(r"(\d+)\s*(day|week)s?", t)
    if m:
        n = int(m.group(1))
        return n * 7 if m.group(2) == "week" else n
    if re.search(r"\ba\s+week\b", t):
        return 7
    if re.search(r"\byesterday\b", t):
        return 1
    if re.search(r"\b(today|just now|few hours)\b", t):
        return 0
    return None


def extract_opened(t):
    if re.search(r"\b(unopened|sealed|unused|(haven'?t|have not|never|didn'?t|not|no)\s+(been\s+)?(opened|used|open|tried|applied))\b", t):
        return False
    if re.search(r"\b(opened|used|tried|applied|unboxed|open)\b", t):
        return True
    return None


def extract_amount(t):
    m = re.search(r"(?:₹|rs\.?|rupees?)\s*(\d[\d,]*)", t) or re.search(r"(\d[\d,]*)\s*(?:rupees?|rs\b|₹)", t)
    return int(m.group(1).replace(",", "")) if m else None


YES = re.compile(r"\b(yes|yeah|yep|yup|sure|please do|go ahead|confirm|haan|haa|kar do|okay|ok)\b")
NO = re.compile(r"\b(no|nope|nahi|nahin|don'?t|do not|leave it|never ?mind|stop)\b")
DAMAGED = re.compile(r"\b(damaged|defective|broken|leak\w*|spill?ed|torn|wrong product|wrong item)\b")
POLICY_Q = re.compile(r"\b(policy|policies|can i|how do i|how can i|is it possible|until when|rules?)\b")

INTENT_PATTERNS = [
    ("CANCELLATION", r"\bcancel\w*"),
    ("RETURN_REFUND", r"\b(return\w*|refund\w*|exchange|replace\w*|damaged|defective|broken|leak\w*|wrong product|wrong item|wapas)\b"),
    ("ORDER_TRACKING", r"\b(track\w*|where\s+(is|'s)|status|kahan|kab\s+(aayega|ayega|milega)|delivery\s+(date|status)|when\s+will|arriv\w+|out for delivery|shipped|dispatch\w*|order\s+update)\b"),
    ("SHIPPING_INFO", r"\b(shipping|delivery\s+(charge|charges|fee|cost|time|take|takes)|how\s+long|free\s+delivery|business days|kitne din)\b"),
    ("PAYMENT_QUERY", r"\b(cod|cash\s+on\s+delivery|upi|payment|pay)\b"),
    ("HUMAN", r"\b(human|real person|representative|manager|supervisor|agent)\b"),
    ("PRODUCT_QUERY", r"\b(about (your|the) (brand|company)|who are you|what is aura|organic|what do you sell|brand)\b"),
    ("OUT_OF_SCOPE", r"\b(flights?|hotel|weather|movie|cricket|joke|song|stocks?|bitcoin|news|recipe|pizza|restaurant|politic\w*|election|homework|translate|capital of|prime minister|president|cab|uber|loan)\b"),
    ("PRODUCT_UNKNOWN", r"\b(ingredient\w*|skin type|oily|dry skin|acne|pimple\w*|allerg\w*|pregnan\w*|side effect\w*|rash|dermatologist|discount|coupon|offer|in stock|available|recommend\w*|which (product|serum))\b"),
    ("THANKS", r"\b(thanks|thank you|shukriya|dhanyavad)\b"),
    ("GOODBYE", r"\b(bye|goodbye|that'?s all|that is all|nothing else)\b"),
    ("GREETING", r"^\s*(hi|hello|hey|namaste|good (morning|afternoon|evening))\b"),
]
INTENT_PATTERNS = [(name, re.compile(p)) for name, p in INTENT_PATTERNS]

CHATTER = {"GREETING", "THANKS", "GOODBYE", "UNCLEAR"}
POLICY_RETURN = (
    "Returns are accepted within 7 days of delivery for unopened, unused products in original packaging. "
    "Damaged or defective products must be reported within 48 hours of delivery with photos for a replacement."
)


def detect_intent(t):
    for name, pattern in INTENT_PATTERNS:
        if pattern.search(t):
            return name
    return None


# ---------- context ----------

def new_context(c):
    base = {
        "last_order_id": None, "awaiting": None, "topic": None,
        "days": None, "opened": None,
        "intents": [], "order_ids": [], "outcomes": [], "notes": [], "cancelled": [],
    }
    return {**base, **copy.deepcopy(c or {})}


def lookup(oid, ctx, tools):
    result = get_order_details(oid)
    if result.get("found") and oid in ctx["cancelled"]:
        result["status"], result["can_cancel"] = "Cancelled", False
    tools.append({"name": "get_order_details", "input": {"order_id": oid}, "output": result})
    if result.get("found"):
        ctx["last_order_id"] = oid
        if oid not in ctx["order_ids"]:
            ctx["order_ids"].append(oid)
    return result


def resolve_order(oid, mentioned, ctx, tools, intent, allow_last=True):
    """Returns (order, early_reply). early_reply is (reply, outcome, note) when we can't continue."""
    if mentioned:
        order = lookup(oid, ctx, tools)
        if not order["found"]:
            ctx["awaiting"] = {"type": "order_id", "intent": intent}
            return None, (
                f"I couldn't locate an order with the ID {spell(oid)}. Could you please repeat or verify the ID?",
                "NOT_FOUND", f"Customer gave order ID {oid}, which does not exist.",
            )
        return order, None
    if allow_last and ctx["last_order_id"]:
        return lookup(ctx["last_order_id"], ctx, tools), None
    ctx["awaiting"] = {"type": "order_id", "intent": intent}
    return None, (
        "Sure, could you please tell me your order ID? It starts with ORD followed by a number.",
        "NEEDS_INFO", "Agent asked the customer for an order ID.",
    )


# ---------- handlers: each returns (reply, outcome, note) ----------

def handle_tracking(o):
    s = o["status"]
    if s == "Out for Delivery":
        return (f"Your {o['product']} is out for delivery with {o['carrier']}, tracking ID {spell(o['tracking_id'])}. "
                f"{o['notes']}.", "ANSWERED", f"Order {o['order_id']} is out for delivery. {o['notes']}.")
    if s == "Delivered":
        return (f"Your {o['product']} was delivered {o['delivered_days_ago']} days ago by {o['carrier']}.",
                "ANSWERED", f"Order {o['order_id']} was delivered {o['delivered_days_ago']} days ago.")
    if s == "Processing":
        return (f"Your {o['product']} order is still being processed. It was ordered 3 hours ago and hasn't shipped yet. "
                "Standard delivery takes 3 to 5 business days.", "ANSWERED", f"Order {o['order_id']} is still processing.")
    return (f"That order is {s.lower()}.", "ANSWERED", f"Order {o['order_id']} is {s.lower()}.")


def handle_cancel(o, ctx):
    s = o["status"]
    if s == "Processing":
        ctx["awaiting"] = {"type": "cancel_confirm", "order_id": o["order_id"]}
        return (f"Your {o['product']} order is still processing, so it can be cancelled. Would you like me to cancel it?",
                "NEEDS_INFO", f"Order {o['order_id']} is eligible for cancellation; asked customer to confirm.")
    if s == "Out for Delivery":
        return ("I'm sorry, that order is already out for delivery, so it can't be cancelled. "
                "You can refuse the delivery at your doorstep if you don't want it.",
                "DECLINED", f"Cancellation of {o['order_id']} declined, order is out for delivery.")
    if s == "Delivered":
        return ("That order has already been delivered, so it can't be cancelled. "
                "If you'd like to return it, returns are accepted within 7 days of delivery for unopened, unused products.",
                "DECLINED", f"Cancellation of {o['order_id']} declined, order already delivered.")
    return ("That order is already cancelled.", "ANSWERED", f"Order {o['order_id']} was already cancelled.")


def handle_return(order, ctx, damaged, order_only_by_id):
    days, opened = ctx["days"], ctx["opened"]
    ctx["topic"] = "RETURN_REFUND"

    if order:
        s = order["status"]
        if s == "Delivered":
            days = order.get("delivered_days_ago", days)
            ctx["days"] = days
        elif s == "Processing":
            return ("That order hasn't been delivered yet, it's still processing. If you don't want it, I can cancel it instead.",
                    "ANSWERED", f"Return asked for {order['order_id']} but it is not delivered; cancellation possible.")
        elif s == "Out for Delivery":
            return ("That order hasn't been delivered yet, it's out for delivery. Once it arrives you can return it within 7 days if it's unopened, "
                    "or refuse the delivery at your doorstep.", "ANSWERED", f"Return asked for {order['order_id']} but it is not yet delivered.")

    if damaged:
        if days is None:
            return (f"I'm sorry about that. {POLICY_RETURN.split('. ')[1]} When was it delivered?",
                    "NEEDS_INFO", "Customer reported a damaged product; asked for delivery date.")
        if days <= 2:
            return ("I'm sorry about that. Since it was delivered within the last 48 hours, you're within the window. "
                    "Please report it with photos of the damage and it will be reviewed for a replacement.",
                    "ANSWERED", "Damaged product reported within 48 hours; advised to send photos.")
        return (f"I'm sorry about that, but damaged or defective products must be reported within 48 hours of delivery with photos, "
                f"and this was delivered {days} days ago. So it falls outside the policy and I can't promise a replacement.",
                "DECLINED", f"Damage report declined; delivered {days} days ago, beyond the 48 hour window.")

    reasons = []
    if opened is True:
        reasons.append("the product has been opened or used")
    if days is not None and days > 7:
        reasons.append(f"it has been {days} days, which is beyond the 7 day window")
    if reasons:
        return ("I'm sorry, but this falls outside our return policy. Returns are accepted within 7 days of delivery for unopened, "
                f"unused products in original packaging. In your case {' and '.join(reasons)}, so I'm unable to offer a return or refund.",
                "DECLINED", "Return request declined: " + "; ".join(reasons) + ".")
    if days is not None and opened is False:
        return ("That fits our return policy, since it's within 7 days and unopened and unused. Please keep it in its original packaging.",
                "ANSWERED", "Return request is within policy (unopened, within 7 days).")
    if days is not None:
        ctx["awaiting"] = {"type": "opened"}
        return ("Returns are only for unopened, unused products in original packaging. Has the product been opened or used?",
                "NEEDS_INFO", "Asked whether the product was opened.")
    if opened is False:
        return ("Thanks. Returns also need to be within 7 days of delivery. When was it delivered?",
                "NEEDS_INFO", "Asked when the product was delivered.")
    return (POLICY_RETURN + " Has your product been opened, and when was it delivered? Or share your order ID and I'll check.",
            "NEEDS_INFO", "Explained return policy and asked for details.")


def handle_shipping(t):
    amount = extract_amount(t)
    if amount is not None:
        if amount > 499:
            return (f"An order of rupees {amount} gets free delivery, and standard delivery takes 3 to 5 business days.",
                    "ANSWERED", "Explained shipping is free for the stated order value.")
        if amount < 499:
            return (f"An order of rupees {amount} has a rupees 50 shipping fee, and standard delivery takes 3 to 5 business days.",
                    "ANSWERED", "Explained a rupees 50 shipping fee applies for the stated order value.")
        return ("Free delivery applies above rupees 499 and orders below that pay rupees 50. Exactly 499 isn't covered in what I have, "
                "so I can't say for sure. Standard delivery takes 3 to 5 business days.", "ANSWERED", "Explained shipping policy; exact 499 boundary unclear.")
    return ("Delivery is free on orders above rupees 499. Orders below that have a rupees 50 shipping fee. "
            "Standard delivery takes 3 to 5 business days.", "ANSWERED", "Explained shipping policy.")


def handle_payment(t):
    amount = extract_amount(t)
    if amount is not None and amount > 2500:
        return (f"Sorry, cash on delivery is only available for orders up to rupees 2,500, so it isn't available for rupees {amount}.",
                "ANSWERED", "COD not available for the stated amount (over 2,500).")
    return ("Cash on delivery is available for orders up to rupees 2,500. You can pay by cash or UPI at your doorstep.",
            "ANSWERED", "Explained COD policy.")


# ---------- main entry ----------

def finish(ctx, tools, intent, reply, outcome=None, note=None):
    if intent and intent not in CHATTER:
        ctx["intents"].append(intent)
        ctx["topic"] = intent
    if outcome:
        ctx["outcomes"].append(outcome)
    if note:
        ctx["notes"].append(note)
    return {"reply": reply, "context": ctx, "intent": intent, "tool_calls": tools}


def respond(text, context=None):
    ctx = new_context(context)
    tools = []
    t = (text or "").lower().replace("’", "'").strip()

    if len(re.sub(r"[^a-z0-9]", "", t)) < 2:
        return finish(ctx, tools, "UNCLEAR", "Sorry, I didn't catch that. Could you please repeat?")

    nt = words_to_digits(t)
    awaiting, ctx["awaiting"] = ctx["awaiting"], None  # handlers set it again if needed
    awaiting_type = awaiting["type"] if awaiting else None

    oid, mentioned = extract_order_id(nt, awaiting_type == "order_id")
    days, opened = extract_days(nt), extract_opened(nt)
    yes, no = bool(YES.search(t)), bool(NO.search(t))

    # pending cancellation confirmation
    if awaiting_type == "cancel_confirm":
        if yes and not no:
            result = cancel_order(awaiting["order_id"])
            tools.append({"name": "cancel_order", "input": {"order_id": awaiting["order_id"]}, "output": result})
            if result["success"]:
                ctx["cancelled"].append(awaiting["order_id"])
                return finish(ctx, tools, "CANCELLATION", "Done, your order has been cancelled. Is there anything else I can help with?",
                              "DONE", f"Order {awaiting['order_id']} was cancelled at the customer's request.")
            return finish(ctx, tools, "CANCELLATION", f"Sorry, I couldn't cancel it. {result['error']}", "DECLINED",
                          f"Cancellation of {awaiting['order_id']} failed.")
        if no:
            return finish(ctx, tools, "CANCELLATION", "No problem, I've left the order as it is. Is there anything else I can help with?",
                          "ANSWERED", "Customer decided not to cancel.")

    # answer to "has it been opened?"
    if awaiting_type == "opened" and opened is None:
        if yes and not no:
            opened = True
        elif no and not yes:
            opened = False

    if days is not None:
        ctx["days"] = days
    if opened is not None:
        ctx["opened"] = opened

    # figure out what they want
    intent = detect_intent(t)
    if intent is None and awaiting_type == "order_id":
        intent = awaiting["intent"]
    if intent is None and ctx["topic"] == "RETURN_REFUND" and (days is not None or opened is not None or awaiting_type == "opened"):
        intent = "RETURN_REFUND"
    if intent is None and mentioned:
        intent = ctx["topic"] if ctx["topic"] in ("ORDER_TRACKING", "CANCELLATION", "RETURN_REFUND") else "ORDER_TRACKING"

    if intent == "GREETING":
        return finish(ctx, tools, intent, "Hello! I can help with order tracking, cancellations, returns, shipping and cash on delivery. What do you need?")
    if intent == "THANKS":
        return finish(ctx, tools, intent, "You're welcome! Is there anything else I can help you with?")
    if intent == "GOODBYE":
        return finish(ctx, tools, intent, "Thank you for calling Aura Skincare. Have a lovely day!")

    if intent == "ORDER_TRACKING":
        order, early = resolve_order(oid, mentioned, ctx, tools, intent)
        return finish(ctx, tools, intent, *(early or handle_tracking(order)))

    if intent == "CANCELLATION":
        if not mentioned and POLICY_Q.search(t):
            ctx["awaiting"] = {"type": "order_id", "intent": intent}
            return finish(ctx, tools, intent,
                          "Orders can be cancelled only while the status is Processing. Once an order is shipped or out for delivery it can't be cancelled, "
                          "but you can refuse delivery at the doorstep. If you share your order ID, I can check yours.",
                          "ANSWERED", "Explained cancellation policy.")
        order, early = resolve_order(oid, mentioned, ctx, tools, intent)
        return finish(ctx, tools, intent, *(early or handle_cancel(order, ctx)))

    if intent == "RETURN_REFUND":
        use_last = days is None and opened is None and not mentioned
        order, early = resolve_order(oid, mentioned, ctx, tools, intent, allow_last=use_last) if (mentioned or (use_last and ctx["last_order_id"])) else (None, None)
        if early:
            return finish(ctx, tools, intent, *early)
        return finish(ctx, tools, intent, *handle_return(order, ctx, bool(DAMAGED.search(t)), mentioned))

    if intent == "SHIPPING_INFO":
        return finish(ctx, tools, intent, *handle_shipping(t))
    if intent == "PAYMENT_QUERY":
        return finish(ctx, tools, intent, *handle_payment(t))
    if intent == "HUMAN":
        return finish(ctx, tools, "OTHER", "I'm not able to transfer this call to a person right now, but I'll do my best to help. What do you need?",
                      "UNKNOWN", "Customer asked for a human agent; not available.")
    if intent == "PRODUCT_QUERY":
        return finish(ctx, tools, intent, "Aura Skincare is a premium organic Indian skincare brand, focused on simple, effective products "
                      "made with thoughtfully selected ingredients.", "ANSWERED", "Shared brand overview.")
    if intent == "PRODUCT_UNKNOWN":
        return finish(ctx, tools, "PRODUCT_QUERY", "I don't have that information, and I don't want to guess. "
                      "For skin concerns it's best to check with a dermatologist. I can help with orders, shipping, returns and cancellations.",
                      "UNKNOWN", "Customer asked a product question the agent has no information on.")
    if intent == "OUT_OF_SCOPE":
        return finish(ctx, tools, intent, "I'm sorry, I can only help with Aura Skincare related queries, like orders, shipping, returns and cancellations. "
                      "Is there anything I can help you with there?", "OUT_OF_SCOPE", "Customer asked something unrelated to Aura Skincare.")

    return finish(ctx, tools, "UNCLEAR", "Sorry, I didn't quite get that. I can help with order tracking, cancellations, returns, shipping and cash on delivery. "
                  "What would you like to know?")


# ---------- post-call summary ----------

def build_summary(ctx):
    ctx = new_context(ctx)
    intents = [i for i in ctx["intents"] if i != "OUT_OF_SCOPE"] or ctx["intents"]
    outcomes = ctx["outcomes"]

    if not outcomes:
        status = "INCOMPLETE"
    elif all(o == "OUT_OF_SCOPE" for o in outcomes):
        status = "OUT_OF_SCOPE"
    elif outcomes[-1] in ("NEEDS_INFO", "NOT_FOUND", "UNKNOWN"):
        status = "UNRESOLVED"
    elif "DECLINED" in outcomes:
        status = "POLICY_DECLINED"
    else:
        status = "RESOLVED"

    return {
        "customer_intent": intents[0] if intents else "OTHER",
        "order_id": ctx["order_ids"][-1] if ctx["order_ids"] else None,
        "resolution_status": status,
        "call_summary": " ".join(ctx["notes"][-4:]) or "The customer did not make a request during the call.",
    }
