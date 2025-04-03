·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌compliment·‌=·‌target·‌-·‌num

·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌num·‌=·‌nums[i]
·‌·‌·‌·‌·‌·‌·‌·‌for·‌i·‌in·‌range(len(nums)):

·‌·‌·‌·‌·‌·‌·‌·‌#·‌if·‌there·‌is·‌a·‌complimentary·‌number·‌that·‌exists·‌within·‌nums·‌return·‌that·‌index·‌i·‌and·‌the·‌key.
·‌·‌·‌·‌·‌·‌·‌·‌dct·‌=·‌{}·‌#·‌dictionary·‌where·‌key·‌represents·‌the·‌number·‌from·‌the·‌current·‌iterated·‌i·‌in·‌nums·‌and·‌value·‌is·‌the·‌index·‌needed·‌to·‌add·‌to·‌the·‌target
·‌·‌·‌·‌def·‌twoSum(self,·‌nums:·‌List[int],·‌target:·‌int)·‌->·‌List[int]:
·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌if·‌compliment·‌in·‌dct:
·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌·‌return·‌[i,·‌dct[compliment]]
            dct[num] = i
class·‌Solution: