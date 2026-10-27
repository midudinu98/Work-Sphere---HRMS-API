from datetime import datetime, timedelta, time

def calculate_late_minutes(actual_check_in: datetime,shift_start: time,grace_minutes: int = 0) -> int:
    
    scheduled_start = datetime.combine(actual_check_in.date(),shift_start)

    late_minutes = int((actual_check_in - scheduled_start).total_seconds() // 60)

    return max(0, late_minutes - grace_minutes)

def calculate_early_checkout_minutes(actual_check_out: datetime,shift_end: time,grace_minutes: int = 0,
    overnight: bool = False,shift_start: time | None = None) -> int:
    
    scheduled_end = datetime.combine(actual_check_out.date(),shift_end)

    if (overnight and shift_start is not None and actual_check_out.time() >= shift_start):
        
        scheduled_end += timedelta(days=1)

    early_minutes = int((scheduled_end - actual_check_out).total_seconds() // 60)

    return max(0, early_minutes - grace_minutes)
