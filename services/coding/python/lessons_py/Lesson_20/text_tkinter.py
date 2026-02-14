from tkinter import *
tk = Tk()
canvas = Canvas(tk, width=300, height=300)
canvas.pack()
canvas.create_text(150, 100, fill = "blue",
                   font=('Times', 15),
                   text = 'Привіт, я Tkinter!')

user_text = input()
canvas.create_text(150, 200, fill = "green",
                   font=('Times', 15),
                   text = user_text)