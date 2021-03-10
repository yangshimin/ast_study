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

// 花指令大体分为：字符串花指令和函数花指令

// 1. 字符串花指令的剔除
// 对于字符串花指令 可以遍历所有的MemberExpression节点 取出object节点名和property节点值 在ObjectExpression节点中找到对应的值 如果类型还是
// MemberExpression 就说明还要继续找 继续取出object节点名和property节点值 继续在ObjectExpression节点中找到对应的值 直到找到的值类型为
// StringLiteral 就进行替换 因此需要用到递归

// 2. 函数花指令的剔除
// 对于函数花指令 也是遍历所有的MemberExpression节点 取出object节点名和property节点值 在ObjectExpression节点中找到对应的值 如果类型为
// FunctionExpression并且函数体内部有MemberExpression节点 就说明还需要继续找 直到找到的类型为FunctionExpression并且函数体内部没有MemberExpression
// 节点 才是最终需要的节点

// 在上面的介绍中 多次提到了在ObjectExpression节点中找到对应的值 这里有一个比较简便的寻找方式 可以在nodejs中定义一个totalObj对象 然后解析
// 源代码中所有的ObjectExpression 加入到totalObj对象中 其中这个对象的各个值都为Node对象 方便后续的操作 比如想要获取_0x22b277['oiFic']
// 只需要执行totalObj['_0x22b277']['oiFic']来获取Node节点
// 生成totalObj对象
var totalObj = {};
function generateObj(ast){
    traverse(ast, {
        VariableDeclarator(path){
            // init节点为ObjectExpression的时候 就是需要处理的对象
            if (t.isObjectExpression(path.node.init)){
                // 取出对象名
                let objName = path.node.id.name;
                // 以对象名作为属性名在totalObj中创建对象
                objName && (totalObj[objName] = totalObj[objName] || {});
                // 解析对象中的每一个属性 加入到新建的对象中 注意属性值依然为Node类型
                totalObj[objName] && path.node.init.properties.map(function(p){
                    // p.value 是一个Node对象
                    totalObj[objName][p.key.value] = p.value;
                });
            }
        },
    });
    return ast;
}
ast = generateObj(ast);

// 字符串花指令: 字符串花指令比较容易剔除 遍历ObjectExpression节点的properties属性 每得到一个Object的value值都递归找到真实的字符串后进行替换

// findRealValue: ObjectProperty的value值有三种类型，分别是MemberExpression、FunctionExpression、StringLiteral
// 先不处理FunctionExpression 而StringLiteral就是真实的字符串也不用处理 所以只需要处理MemberExpression
function findRealValue(node){
    if (t.isMemberExpression(node)){
        let objName = node.object.name;
        let propName = node.property.value;
        if (totalObj[objName][propName]){
            return findRealValue(totalObj[objName][propName]);
        }else{
            return false;
        }
    }
    else{
        return node;
    }
}
// 字符串花指令剔除
traverse(ast, {
    VariableDeclarator(path){
        if(t.isObjectExpression(path.node.init)){
            path.node.init.properties.map(function(p){
                let realNode = findRealValue(p.value);
                realNode && (p.value = realNode);
            })
        }
    }
})
// 去除字符串花指令 需要更新一下totalObj
ast = generateObj(ast);
// 上述过程只是把objectExpression的属性值都处理了一下 最后还要对代码中引用的地方进行替换
traverse(ast, {
    MemberExpression(path){
        let objName = path.node.object.name;
        let propName = path.node.property.value;
        totalObj[objName] && t.isStringLiteral(totalObj[objName][propName]) &&
        path.replaceWith(totalObj[objName][propName])
    }
})

let code = generator(ast).code;
console.log(code);
// fs.writeFile('./demo/demo字符串解密以及去除数组混淆.js', code, (err)=>{});
