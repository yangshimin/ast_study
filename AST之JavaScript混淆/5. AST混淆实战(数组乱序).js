const fs = require('fs');
// 解析js,将js代码转换为AST
// parser的parse方法有第二个参数sourceType, 当js代码中含有import、export (es6的代码)等关键字时
// 需要指定sourceType为module
const parser = require("@babel/parser");
// 用来遍历AST中的节点
const traverse = require("@babel/traverse").default;
// 用来判断节点类型和生成新的节点等
const t = require("@babel/types");
// 用来把AST代码转换成JS代码
// generator 也有其他参数，具体参考文档: https://babeljs.io/docs/en/@babel-generator
const generator = require("@babel/generator").default;

const js_code = fs.readFileSync("F:\\code\\ast_study\\demo\\demo2.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// 数组乱序
// 经过数组混淆以后的代码 引用处的数组索引与原先字符串还是一一对应的 所以我们要打乱这个数组的顺序
// 代码较为简单 传一个数组进去 并且指定循环次数 每次循环都把数组后面的成员放前面 同时既然数组的顺序和原先的不一样了
// 那么被混淆的代码在执行之前是需要还原的 因此还需要一段还原数组顺序的代码 这里的代码逆向编写即可 循环一样的次数 把数组前面的成员放后面

// 还原数组顺序的代码要和被混淆的代码放在一起 把还原数组顺序的代码保存到新文件
// demoFront.js 读取该文件并解析成astFront 由于还原数组顺序的代码最外层只有
// 一个函数节点 所以取出其中的astFront.program.body[0] 放如到被混淆代码中的body即可

// 读取还原数组顺序的函数 并解析成astFront
const jscodeFront = fs.readFileSync("F:\\code\\ast_study\\demo\\demoFront.js", {
    encoding: "utf-8"
});
let astFront = parser.parse(jscodeFront);

// 简单自定义一个加密函数
function base64Encode(str) {
    let b = new Buffer.from(str);
    return b.toString('base64');
}

// 简单自定义一个解密函数
// 注意： 这个加密函数应该放在混淆后的代码中 如果不放 混淆后的代码是不能正常运行的
function baseDecode(str) {
    let b = new Buffer.from(str, 'base64');
    return b.toString("utf-8");

}

let bigArr = [];
const visitor = {
    // 改变属性访问访问
    MemberExpression(path){
        if (t.isIdentifier(path.node.property)){
            let name = path.node.property.name;
            path.node.property = t.stringLiteral(name);
        }
        // computed为真表示以中括号的形式访问 为假表示以点的形式去访问
        path.node.computed = true;
    },
    // 内置函数或全局函数改变调用方式
    Identifier(path) {
        let name = path.node.name;
        if ('eval|parseInt|encodeURIComponent|Object|Function|Boolean|Number|Math|Date|String|RegExp|Array'.indexOf("|" + name + "|") != -1){
            path.replaceWith(t.memberExpression(t.identifier('window'), t.stringLiteral(name), true));
        }
    },
    // 字符串加密并进行数组混淆
    StringLiteral(path){
        let cipherText = base64Encode(path.node.value);
        // 如果数组中已经存在 则取已经存在的元素索引
        let bigArrIndex = bigArr.indexOf(cipherText);
        let index = bigArrIndex;
        // 如果数组中不存在 则push元素到数组中 并获取索引
        if (bigArrIndex === -1){
            let length = bigArr.push(cipherText);
            index = length - 1;
        }

        let encStr = t.callExpression(
            t.identifier('baseDecode'),
            [t.memberExpression(t.identifier('arr'), t.numericLiteral(index), true)]
        );
        path.replaceWith(encStr);
    }
}

traverse(ast, visitor);

// 当前bigArr 中的成员还只是JS中的字符串 并不是AST中需要的StringLiteral节点 因此还需要做进一步处理 就是把bigArr中的成员都转成stringLiteral
// 节点
bigArr = bigArr.map(function (v) {
    return t.stringLiteral(v);
});

// 打乱数组顺序s
(function(myArr, num){
    var xiaojianbang = function(nums){
        while (--nums){
            myArr.unshift(myArr.pop());
        }
    };
    xiaojianbang(++num);
})(bigArr, 0x10);

// 把还原数组顺序的代码中关于数组操作的代码编码一下
// 注意： 为什么这里没有把字符串加密然后添加到数组中去 是因为如果这样做 数组的顺序就乱了 通过索引访问的不一定是正确的值
function hexEnc(code){
    for (var hexStr = [], i=0, s; i < code.length; i++){
        s = code.charCodeAt(i).toString(16);
        hexStr += "\\x" + s;
    }
    return hexStr;
}
// 把还原数组顺序的代码中list.push 和 list.shift操作改为list['push']和list['shift']
// 并把字符串'push' 和 'shift'编码
traverse(astFront, {
    MemberExpression(path) {
        if (t.isIdentifier(path.node.property)){
            let name = path.node.property.name;
            path.node.property = t.stringLiteral(hexEnc(name));
        }
        path.node.computed = true;
    }
})

// 先把还原数组顺序的代码 加入到被混淆代码的ast中
ast.program.body.unshift(astFront.program.body[0]);

// 构建数组声明语句
bigArr = t.variableDeclarator(t.identifier('arr'), t.arrayExpression(bigArr));
bigArr = t.variableDeclaration('var', [bigArr]);

// 把数组放到被混淆代码的ast最前面
ast.program.body.unshift(bigArr);

let code = generator(ast).code;
console.log(code);
// fs.writeFile('C:\\Users\\Yang\\WebstormProjects\\ast_study\\new_demo.js', code, (err)=>{});