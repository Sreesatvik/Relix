"""
Business Context Data

Provides high-level business logic, targets, orders, and cost metrics 
for manufacturing lines.
"""

BUSINESS_CONTEXT = {
    "LINE-2": {
        "production_target_units": 15000,
        "order_priority": "HIGH",
        "cost_per_hour_downtime": 25000,
        "customer_orders": [
            {
                "order_id": "ORD-2001",
                "customer": "Global Motors",
                "units": 8000,
                "deadline": "2026-08-25T17:00:00Z"
            },
            {
                "order_id": "ORD-2002",
                "customer": "Apex Industrial",
                "units": 7000,
                "deadline": "2026-08-28T12:00:00Z"
            }
        ]
    },
    "LINE-4": {
        "production_target_units": 10000,
        "order_priority": "CRITICAL",
        "cost_per_hour_downtime": 45000,
        "customer_orders": [
            {
                "order_id": "ORD-4001",
                "customer": "Defense Logistics",
                "units": 5000,
                "deadline": "2026-08-20T08:00:00Z"
            },
            {
                "order_id": "ORD-4002",
                "customer": "AeroTech Solutions",
                "units": 5000,
                "deadline": "2026-08-22T15:00:00Z"
            }
        ]
    }
}
