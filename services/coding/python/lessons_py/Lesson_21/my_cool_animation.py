import time
from tkinter import *
tk = Tk()

canvas = Canvas(tk, width=400, height=300)
canvas.pack()
def play():
    my_image = PhotoImage(file="robot.gif")
    canvas.create_image(5,5, anchor=NW,
                    image=my_image)
    for x in range(0,70):
        canvas.move(1,5,0)
        tk.update()
        time.sleep(0.05)
btn = Button(tk, text="Play!", command=play)
btn.pack()