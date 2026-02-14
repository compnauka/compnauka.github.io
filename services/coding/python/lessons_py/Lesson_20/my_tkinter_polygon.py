from tkinter import *

tk = Tk()
canvas = Canvas(tk, width=300, height=300)
canvas.pack()
canvas.create_polygon(50, 60,
                      200, 140,
                      190, 80,
                      290, 200,
                      150, 280,
                      150, 130,
                      20, 280,
                      fill="brown",
                      outline="black")