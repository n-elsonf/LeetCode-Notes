class Solution:
    def maximumTripletValue(self, nums: List[int]) -> int:
        # # find the biggest number
        # # find the smallest number
        # # find the biggest number after the first

        # res = 0
        # for i in range(len(nums)):
        #     for j in range(i+1, len(nums)):
        #         parens = nums[i]-nums[j]
        #         if parens < 0:
        #             continue
        #         for k in range(j+1, len(nums)):
        #             res = max(parens*nums[k],res)

        # prefix max array
        N = len(nums)
        res = 0
        if N < 3:
            return 0
        
        # Calculate prefix max
        prefix_max = [0] * N
        prefix_max[0] = nums[0]
        for i in range(1, N):
            prefix_max[i] = max(prefix_max[i-1], nums[i])
        
        # Calculate suffix max
        suffix_max = [0] * N
        suffix_max[N-1] = nums[N-1]
        for i in range(N-2, -1, -1):
            suffix_max[i] = max(suffix_max[i+1], nums[i])


        # given a number in the array, we can gaurantee that we will always get the number by finding the suffix max after the element and prefix before.
        # we do not want to use the prefix and suffix elm at index i for the case that that the suffix i or prefix i kmay equal to nums[i] breaking
        # the i < j < k rule.
        for i in range(1, N-1):
            res = max(res, (prefix_max[i-1] - nums[i]) * suffix_max[i+1])

        
        print("prefix max", prefix_max)
        print("suffix max", suffix_max)

        print(res)
        return res
