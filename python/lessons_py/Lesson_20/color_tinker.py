from tkinter import *

tk = Tk()
canvas = Canvas(tk, width=300, height=300)
canvas.pack()

canvas.create_rectangle(10,10,290,290,
                        outline='red',
                        fill="#a0f948")