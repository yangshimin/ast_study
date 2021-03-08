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

const js_code = fs.readFileSync("C:\\Users\\Yang\\WebstormProjects\\ast_study\\demo\\还原demo.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// 字符串解密和去数组混淆：取出大数组和解密函数 然后用eval执行到内存 然后替换代码中有调用的地方

// 先初始化一个解密函数的函数名
let DecryptFuncName = "";
// 取出解密函数的AST
let stringDecryptFuncAst = ast.program.body[2];
let DecryptFunc = stringDecryptFuncAst.declarations[0];
// 解析解密函数的函数名
DecryptFunc && (DecryptFuncName = DecryptFunc.id.name);

// 初始化一个空的AST对象
let newAst = parser.parse('');
// 把解密数组相关的代码push到空的AST对象中
newAst.program.body.push(ast.program.body[0]);
newAst.program.body.push(ast.program.body[1]);
newAst.program.body.push(stringDecryptFuncAst);
// 把解密函数的AST转为字符串形式的JS代码
// 这里需要注意用generate生成代码的时候 需要压缩一下 因为可能存在格式化检测的代码
let stringDecryptFunc = generator(newAst, {compact: true}).code;
// 用eval执行解密函数的字符串形式的代码
eval(stringDecryptFunc);

// 遍历AST进行字符串解密
traverse(ast, {
    VariableDeclarator(path){
        if (path.node.id.name === DecryptFuncName){
            // DecryptFuncName 是一个Identifier
            // binding.referencePaths 里存放的是所有引用到这个identifier的地方, 存放的元素是Identifier类型的path对象
            let binding = path.scope.getBinding(DecryptFuncName);
            binding && binding.referencePaths.map(function (v){
                v.parentPath.isCallExpression() &&
                v.parentPath.replaceWith(t.stringLiteral(eval(v.parentPath.toString())));
            });
        }
    }
});

ast.program.body.shift();
ast.program.body.shift();
ast.program.body.shift();



let code = generator(ast).code;
console.log(code);
// fs.writeFile('./demo/demo字符串解密以及去除数组混淆.js', code, (err)=>{});
