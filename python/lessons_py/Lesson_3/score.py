# Матеріали уроку

scr = 100
message = f"Score is {scr}"
print(message)

scr = 100
msg = "Score is %s"
print(msg % scr)

scr = 100
msg_1 = "Score is {}".format(scr)
msg_2 = f"Score is {scr}"
print(msg_1)
print(msg_2)

scr_1 = 100
scr_2 = 1000
msg_1 = "Is score %s or %s?"
msg_2 = f"Is score {scr_1} or {scr_2}?"
print(msg_1 % (scr_1, scr_2))
print(msg_2)