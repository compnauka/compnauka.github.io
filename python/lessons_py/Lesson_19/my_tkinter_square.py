from tkinter import *

tk = Tk()
canvas = Canvas(tk,
                height = 400,
                width = 400)
canvas.pack()
canvas.create_line(100,100,300,100)
canvas.create_line(100,100,100,300)
canvas.create_line(100,300,300,300)
canvas.create_line(300,100,300,300)