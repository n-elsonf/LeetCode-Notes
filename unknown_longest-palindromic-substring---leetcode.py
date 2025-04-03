class Solution:
    def longestPalindrome(self, s: str) -> str:
        if len(s) <= 1:
            return s
            
        rows, cols = len(s),len(s)
        opt = [[False for _ in range(len(s))] for _ in range(len(s))]
        # opt represents if the the substring from j to i is a paldinrome
        # if the fist and last letter are the samea nd j-1 and i +1 is a palidnrome, imbtc that opt[j][i] will be True
        maxlen = 1
        maxstr = s[0]

        for i in range(len(s)):
            opt[i][i] = True
            for j in range(i):
                if s[j] == s[i] and (i-j<=2 or opt[j+1][i-1]):
                    opt[j][i] = True
                    if i-j+1 > maxlen:
                        maxlen = i-j+1
                        maxstr = s[j:i+1]
        return maxstr