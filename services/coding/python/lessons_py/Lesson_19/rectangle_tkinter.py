from tkinter import *

tk = Tk()
canvas = Canvas(tk,
                height = 600,
                width = 750)
canvas.pack()
canvas.create_rectangle(100,100,500,500)
canvas.create_rectangle(250,50,650,450)

canvas.create_line(100,100,250,50)
canvas.create_line(650,450,500,500)
canvas.create_line(100,500,250,450)
canvas.create_line(500,100,650,50)