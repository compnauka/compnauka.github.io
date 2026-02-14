from tkinter import *

tk = Tk()
canvas = Canvas(tk, width=300, height=300)
canvas.pack()
canvas.create_polygon(200, 220,
                      140, 30,
                      220, 180,
                      40, 280,
                      fill="brown",
                      outline="black")