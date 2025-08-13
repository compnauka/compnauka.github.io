from tkinter import *

tk = Tk()
canvas = Canvas(tk, width=300, height=300)
canvas.pack()
canvas.create_arc(10, 10, 200, 100,
                  extent=180,
                  style=ARC)