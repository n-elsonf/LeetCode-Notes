class Solution:
    def reverse(self, x: int) -> int:
        number = str(x)
        number = number.replace("", " ")
        list = number.split()
        list.reverse()
        if "-" in list:
            list.remove("-")
            list.insert(0,"-")
            m = "".join(list)
            m = int(m)
            if m < -2**31 or m > 2**31:
                return 0 
        num = int("".join(list))
        if num < -2**31 or num > 2**31:
            return 0
        return num