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

// 数组混淆
// 经过字符串加密以后的代码 可以看到字符串虽然加密了 但是依然在原先的位置 数组混淆要做的事情 就是把这些字符串提取到数组中 原先字符串的地方
// 改为以数组下标的方式去访问数组成员 其实还可以提取到多个数组中 不同的数组处于不同的作用域中

// 举个例子 如Date[atob("eHJvdG90eXB1")] 把"eHJvdG90eXB1"变成数组arr的下标为0的成员后 原先字符串的位置就变为
// Date[atob(arr[0])] 当然还需要额外生成一个数组放如到被混淆的代码中

// AST 的处理首先就是遍历StringLiteral节点 既然这个也是遍历StringLiteral节点 那么就可以和字符串加密一起处理了 先
// 来构造出这么一个结构atob(arr[0])
/*
let encStr = t.callExpression(
    t.identifier('atob'),
    [t.memberExpression(t.identifier('arr'), t.numericLiteral(index), true)]
)
 */
// 上述代码构建了一个CallExpression 函数名为 atob 参数是MemberExpression 这个MemberExpression的object属性为arr(
// 就是待会要生成的数组名) property 属性为数组索引index 这个值当前未知 接着要把代码中的字符串放入数组中 然后得到对应的索引
// 这里有两种方案 第一种是不管字符串有没有重复 遍历到一个就往数组里放 然后把新的所以赋值给上述代码中的index 第二种是字符串放入
// 数组之前 先查询一下数组中有没有相同的 如果有相同的话 得到原先那个索引赋值给index 这里采用第二种


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

// 现在开始把bigArr加入到ast中 也就是要先用types组件生成一个数组声明 并且数组成员与bigArr一致 然后加入到被混淆代码的最上面
bigArr = t.variableDeclarator(t.identifier('arr'), t.arrayExpression(bigArr));
bigArr = t.variableDeclaration('var', [bigArr]);
// 用unshift把bigArr加入到代码最前面
ast.program.body.unshift(bigArr);

let code = generator(ast).code;
console.log(code);
// fs.writeFile('C:\\Users\\Yang\\WebstormProjects\\ast_study\\new_demo.js', code, (err)=>{});