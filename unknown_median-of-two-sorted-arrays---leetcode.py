class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        # we run binary search on the smaller array to create a left partition from both nums1 and nums2
        # by creating left partitions we are able to figure out the right partitions, but we then need to check
        # if creating the left partition of the merged array is valid by checking the leftmost values of the each left
        # partition to leq than the first value of the right partition of the OPPOSITE array (LM of left partition nums1 <= 1st elm of right
        # partiion of nums2 and the opposite)
        # if one cases were to fail, then we update the BS pointer accordingly. e.g
            # if we have too many elms in the A partition, we need to remove it by setting right pointer to be mid -1 
            # respectively, if we have too little s.t Bleft > Aright, we add more elms by setting l = mid + 1
        # if valid there are two cases that the merged array is even or odd. if it is odd then we check whichever is the minimal
        # if mergee array is even, we take the max value of both left partitions added to the min value of both right partitions and divide by 2

        # always want to run BS on the smaller array so we dont get index oob error
        A,B = nums1,nums2
        total = len(A) + len(B)
        half = total // 2
        if len(B) < len(A):
            A,B=B,A

        l,r = 0, len(A)-1

        while True:
            i = (l+r)//2
            j = half - i - 2 # zero-index must minus 2 (we accounting for both len of A and B)
            # more readiability is half - (i+1) - 1
            # partition x needs to be back to 1-indexed to find the total legnth nad then subtract 1 agai nto find the respective index.
            
            # there will be cases where making the partitions can cause the pointers to go out of bounds, therefore we need
            # to solve this edge cases by making OOB pointers to be either neg. or pos. infinity
            Aleft = A[i] if i >= 0 else float("-inf")
            Aright= A[i+1] if (i+1) < len(A) else float("inf")
            Bleft = B[j] if j >= 0 else float("-inf")
            Bright = B[j+1] if (j+1) < len(B) else float("inf")

            if Aleft <= Bright and Bleft <= Aright:
                # if odd
                if total % 2:
                    return min(Aright,Bright)
                else:
                    return (max(Aleft,Bleft) + min(Aright,Bright)) / 2.
            elif Aleft > Bright:
                r = i - 1
            else:
                l = i + 1
            

