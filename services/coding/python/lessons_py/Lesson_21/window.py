from tkinter import *
tk = Tk()

canvas = Canvas(tk, width=500, height=500)
canvas.pack()

def print_hello():
    canvas.create_text(100,100, text="Hello")
  
    
btn = Button(tk, text="Press me!", command = print_hello)
btn.pack()

btn = Button(tk, text="Press!", command = print_hello)
btn.pack()