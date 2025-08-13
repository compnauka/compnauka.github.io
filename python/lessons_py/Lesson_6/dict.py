# Матеріали уроку

capitals = {"USA": "Washington",
            "Ukraine": "Kyiv",
            "Uganda": "Kampala",
            "UAE": "Abu Dhabi",
            "UK": "London",
            "Uruguay": "Montevideo",
            "Uzbekistan": "Tashkent"}
print(capitals)

print(capitals["UK"])

capitals["UK"] = "Liverpool"
print(capitals["UK"])

del capitals["Uruguay"]
print(capitals)