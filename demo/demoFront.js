// 还原数组顺序
(function(myArr, num){
    var xiaojianbang = function(nums){
        while (--nums){
            myArr.push(myArr.shift());
        }
    };
    xiaojianbang(++num);
})(arr, 0x10);