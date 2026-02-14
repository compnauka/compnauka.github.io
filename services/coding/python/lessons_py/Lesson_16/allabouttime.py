from time import *

def year():
    return localtime()[0]

def month():
    m = localtime()[1]
    if m == 6:
        return "June"
    if m == 7:
        return "July"
    if m == 8:
        return "August"