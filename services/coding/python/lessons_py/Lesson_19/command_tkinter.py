from tkinter import *

def hello():
    print('Hello, Tkinter!')

tk = Tk()
btn = Button(tk,
             text="Press Me!",
             command = hello)
btn.pack()