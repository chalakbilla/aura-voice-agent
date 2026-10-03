import re

# Mock order "database". Swap this dict for Postgres queries if you want persistence.
ORDERS = {
    "ORD-101": {
        "customer": "Priya Sharma",
        "product": "Vitamin C Serum (30ml)",
        "value": 699,
        "status": "Out for Delivery",
        "carrier": "BlueDart",
        "tracking_id": "BD-982103",
        "notes": "Expected by 6 PM today",
    },
    "ORD-102": {
        "customer": "Rahul Verma",
        "product": "Hydrating Sunscreen SPF 50",
        "value": 499,
        "status": "Delivered",
        "carrier": "Delhivery",
        "tracking_id": "DL-441029",
        "notes": "Delivered 14 days ago",
        "delivered_days_ago": 14,
    },
    "ORD-103": {
        "customer": "Ananya Patel",
        "product": "Green Tea Face Wash + Toner",
        "value": 850,
        "status": "Processing",
        "carrier": None,
        "tracking_id": None,
        "notes": "Ordered 3 hours ago",
    },
}


def normalize_id(raw):
    """'ord 101', 'ORD101', 'ord-101' -> 'ORD-101'"""
    if not raw:
        return None
    m = re.search(r"ORD\D*(\d+)", str(raw).upper())
    return f"ORD-{m.group(1)}" if m else str(raw).strip().upper()


def get_order_details(order_id):
    oid = normalize_id(order_id)
    if not oid:
        return {"found": False, "error": "No order ID provided."}
    order = ORDERS.get(oid)
    if not order:
        return {"found": False, "order_id": oid, "error": "No order found with this ID."}
    return {
        "found": True,
        "order_id": oid,
        **order,
        "can_cancel": order["status"] == "Processing",
        "shipping_fee_applied": order["value"] < 499,
    }


def cancel_order(order_id):
    oid = normalize_id(order_id)
    order = ORDERS.get(oid) if oid else None
    if not order:
        return {"success": False, "error": "No order found with this ID."}
    if order["status"] != "Processing":
        return {
            "success": False,
            "order_id": oid,
            "error": f"Order is {order['status']} and can no longer be cancelled.",
        }
    # not mutated on purpose: the cancelled state travels in the call context (works on serverless)
    return {"success": True, "order_id": oid, "status": "Cancelled"}
