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

// 去除函数花指令: 原理与剔除字符串花指令的原理差不多 只是需要改一下递归的函数

function findRealFunc(node){
    // 因为例子中的函数花指令的函数体只有一句话
    if (t.isFunctionExpression(node) && node.body.body.length === 1){
        let expr = node.body.body[0].argument.callee;
        if (t.isMemberExpression(expr)){
            let objName = expr.object.name;
            let propName = expr.property.value;
            if (totalObj[objName]){
                return findRealFunc(totalObj[objName][propName]);
            }else{
                return false;
            }
        }
        return node;
    }else{
        return node;
    }
}

// 函数花指令剔除
traverse(ast, {
    VariableDeclarator(path){
        if(t.isObjectExpression(path.node.init)){
            path.node.init.properties.map(function(p){
                let realNode = findRealFunc(p.value);
                realNode && (p.value = realNode);
            })
        }
    }
})
// 去除函数花指令 需要更新一下totalObj中的内容
ast = generateObj(ast);
traverse(ast, {
    CallExpression(path) {
        // 筛选出callee为MemberExpression的节点
        if(!t.isMemberExpression(path.node.callee)) return;
        // 取出对象名和属性名
        let objName = path.node.callee.object.name;
        let propertyName = path.node.callee.property.value;
        // 如果在totalObj中存在相应的节点 就是需要进行替换的
        if (totalObj[objName] && totalObj[objName][propertyName]){
            // totalObj中存放的是函数节点
            let myFunc = totalObj[objName][propertyName];
            // 在原代码中 函数体其实就一句return代码 取出其中的argument节点
            let returnExpr = myFunc.body.body[0].argument;
            // 判断argument节点类型 并且用相应的实参来构建二项式或调用表达式 然后替换当前遍历到的整个CallExpression节点即可
            if (t.isBinaryExpression(returnExpr)){
                let binExpr = t.binaryExpression(returnExpr.operator, path.node.arguments[0], path.node.arguments[1]);
                path.replaceWith(binExpr);
            }else if(t.isCallExpression(returnExpr)){
                let newArr = path.node.arguments.slice(1);
                let callExpr = t.callExpression(path.node.arguments[0], newArr);
                path.replaceWith(callExpr);
            }
        }

    }
})

// 此时代码中就存在了没有引用的地方 所以可以删除这些没有引用的地方
// 这里是通过scope的constant来进行判断 constant为真表示是一个常量 constantViolations这个数组为空 就代表没有任何地方修改它 这时就可以删除它
traverse(ast, {
    VariableDeclarator(path){
        // 这里主要是案例中现在没有被引用到的对方都是object
        if(t.isObjectExpression(path.node.init)){
            path.remove();
        }
    }
})

// switch还原
// 因为可能存在Switch嵌套 所以这里循环多次
for (let i = 0; i < 20; i++){
    traverse(ast, {
        // 因为代码中switch 混淆的分发器是"0|1|4|2|3"["split"]("|") 所以通过遍历MemberExpression和条件判断来找到分发器内容
        MemberExpression(path){
            if(t.isStringLiteral(path.node.object) && t.isStringLiteral(path.node.property, {value:  'split'})){
                // 找到最近的父节点 当前path是分发器 父节点就是分发器的定义语句 因为代码中下一句就是switch混淆
                // 所以通过找父节点的兄弟节点来定位while循环
                let varPath = path.findParent(function (p){return t.isVariableDeclaration(p);});
                if (!varPath) return;
                //varPath.key 就是var语句在body数组中索引
                let whilePath = varPath.getSibling(varPath.key + 1);

                // 解析整个Switch 把case语句的条件值和要执行内容做个映射 一一对应起来
                let myArr = [];
                whilePath.node.body.body[0].cases.map(function(p){
                    myArr[p.test.value] = p.consequent[0];
                });

                // 做好映射后 把原先代码中的var定义语句和while循环语句删除掉 准备还原
                let blockStatement = whilePath.parent;
                varPath.remove();
                whilePath.remove();
                // 还原顺序
                // 分发器中有正确的代码执行顺序 所以通过分发器的内容还原代码的执行顺序
                let shuffleArr = path.node.object.value.split("|");
                shuffleArr.map(function (v){
                    blockStatement.body.push(myArr[v]);
                });
                path.stop();
            }
        }
    })
}

let code = generator(ast).code;
console.log(code);
// fs.writeFile('./demo/demo字符串解密以及去除数组混淆.js', code, (err)=>{});
