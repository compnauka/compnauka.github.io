from tkinter import *

tk = Tk()
canvas = Canvas(tk,
                height = 500,
                width = 500)
canvas.pack()
canvas.create_line(0,0,500,500)
canvas.create_line(0,250,500,250)