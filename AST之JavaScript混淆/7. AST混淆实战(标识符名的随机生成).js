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

const js_code = fs.readFileSync("F:\\code\\ast_study\\demo\\标识符重命名案例.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// 标识符名的随机生成：如果在随机生成标识符名之前还有一些生成节点的操作 那么需要需要先把AST转为js代码 然后再把js代码转为ast

// 在前面 重命名标识符的时候使用的是固定的_0x2ba6ea加上一个自增的数字来作为新的标识符名 现在我们将使用大写字母O
// 小写字母o 数字0这三个字符来组成标识符名 把前面 var newName = '_0x2ba6ea' + i++ 这句代码改成var newName =
// generatorIdentifier(i++);
function generatorIdentifier(decNum) {
    let flag = ['O', 'o', '0'];
    let retval = [];
    // 因为flag定义了三种字符 所以这里进行了转3进制的操作
    // 但更好的应该是parseInt(decNum).toString(3)
    while(decNum > 0){
        retval.push(decNum % 3);
        decNum = parseInt(decNum / 3);
    }

    // 得到三进制结果后将值作为索引取flag中的值
    let Identifier = retval.reverse().map(function (v) {
        return flag[v]
    }).join('');
    Identifier.length < 6 ? (Identifier = ('OOOOOO' + Identifier).substr(-6)) :
        Identifier[0] == '0' && (Identifier = 'O' + Identifier);
    return Identifier;
}

function renameOwnBinding(path){
    // globalBindingObj：不作处理的变量
    // OwnBindingObj: 要做处理的变量
    let OwnBindingObj = {}, globalBindingObj = {}, i = 0;
    // 打印当前节点的js代码
    // console.log(path + "");

    path.traverse({
        Identifier(p) {
            let name = p.node.name;
            // p.scope.getOwnBinding(name): 获取标识符名的绑定
            // 但有几个需要注意的地方： 一. 可以获取到子函数内部的标识符的绑定
            // 二. 以functionDeclaration方式定义函数获取到的绑定是underfined, 但是在调用的时候可以获取到绑定
            let binding = p.scope.getOwnBinding(name);
            // path + "": 通过隐式转换把AST转为js代码
            // binding.scope.block: 获取当前绑定的作用域
            // 当节点为Program或者有函数定义的有子函数时 p.scope.getOwnBinding(name) 也会获取到函数内部的绑定 这样获取的绑定就把和局部标志符名混合
            // 了 所以通过如下方式把绑定的作用域js代码和节点的js代码做比较是否一致来判断
            binding && generator(binding.scope.block).code == path + "" ?
                (OwnBindingObj[name] = binding) : (globalBindingObj[name] = 1);
        }
    });

    // 开始对存储的要重命名的标识符进行遍历
    for (let oldName in OwnBindingObj) {
        // 避免要重命名的标识符与不做处理的标志符名相同了
        do {
            var newName = generatorIdentifier(i++);
        } while (globalBindingObj[newName]);

        // 重命名
        OwnBindingObj[oldName].scope.rename(oldName, newName);
    }
}

// 遍历三种节点 执行同一个重命名方法
traverse(ast, {
    'Program|FunctionExpression|FunctionDeclaration'(path) {
        renameOwnBinding(path);
    }
});


let code = generator(ast).code;
console.log(code);
// fs.writeFile('F:\\code\\ast_study\\demo\\new_demo.js', code, (err)=>{});