from tkinter import *
tk = Tk()

def rectangle():
    canvas.create_rectangle(100,100,300,300,
                            fill="green")
    
canvas = Canvas(tk, width=400, height=400)
canvas.pack()

btn = Button(tk, text="Press!", command=rectangle)
btn.pack()
