import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
from backend.monitor.monitor_agent import run_monitor_loop

if __name__ == "__main__":
    try:
        # Run quickly for 3 iterations, 1 second apart, then exit
        async def quick_test():
            print("Running test monitor...")
            # We will use asyncio.wait_for to stop it after a few seconds
            try:
                await asyncio.wait_for(run_monitor_loop(interval_seconds=1), timeout=8.0)
            except asyncio.TimeoutError:
                print("Test monitor completed successfully.")
        
        asyncio.run(quick_test())
    except KeyboardInterrupt:
        print("Interrupted")
