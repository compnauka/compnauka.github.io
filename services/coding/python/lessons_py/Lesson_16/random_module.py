import random

print(random.randint(1,100))
d_list = [1,12,23,34,45,56]
print(random.choice(d_list))
random.shuffle(d_list)
print(d_list)