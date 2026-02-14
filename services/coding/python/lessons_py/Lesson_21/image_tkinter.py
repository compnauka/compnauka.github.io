from tkinter import *
tk = Tk()

canvas = Canvas(tk, width=300, height=300)
canvas.pack()

my_image = PhotoImage(file="minecraft.gif")
canvas.create_image(0,0,
                    anchor=NW,
                    image=my_image)