# Практична робота

import time

timer = 10
while timer > 0:
    print("Залишилось ", timer)
    timer -= 1
    time.sleep(1)
print("Час вийшов!")