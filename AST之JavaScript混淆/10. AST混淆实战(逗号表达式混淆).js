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

// 逗号表达式混淆

// 普通语句与return语句连接
/*
function test(a){
    a = a + 100;
    return a;
}

function test_(a){
    // 不能这样操作：a = a + 100, return a;
    return a = a + 100, a;
}
*/
// 从上述例子中可以看出 普通语句与return语句连接 需要提取出return语句的argument部分 最后重新构建return节点 把整个逗号表达式作为
// argument部分 接着看一下如何把函数中的所有声明语句 提取到参数列表中


/*
visitor1 = {
    FunctionExpression(path){
        let blockStatement = path.node.body;
        let blockStatementLength = blockStatement.body.length;
        if (blockStatementLength < 2) return;
        // 把所有声明的变量提取到参数列表中
        path.traverse({
            VariableDeclaration(p) {
                declarations = p.node.declarations;
                let statements = [];
                declarations.map(function (v) {
                    // 把变量提升到参数列表中后 变量定义语句就要相应的改为赋值语句
                    path.node.params.push(v.id);
                    v.init && statements.push(t.assignmentExpression('=', v.id, v.init));

                });
                p.replaceInline(statements);
            }
        });
    }
};
*/
// 遍历FunctionExpression节点 取出blockStatement.body节点 里面存放的就是函数体中所有的 语句 如果语句少于2条 就不做任何处理 紧接着 遍历
// 当前函数下所有的VariableDeclaration节点 其中的declarations数组 即声明的具体变量 通过map方法遍历整个数组 通过path.node.params.push(v.id)
// 将变量提取到函数的参数列表中 然后就要考虑两种情况 一种是变量没有初始化了 那么就不加入到statements数组中 最后替换节点的时候相当于移除了 另一种是
// 变量初始化了 那么就将VariableDeclarator该为赋值语句


// 函数体中的语句 有时候会在外面包裹一层ExpressionStatement节点 这会影响判断语句类型 所以会把这类语句外层的ExpressionStatement节点给去掉
/*
let firstSta = blockStatement.body[0], i=1;
while (i < blockStatementLength){
    let tempSta = blockStatement.body[i++];
    t.isExpressionStatement(tempSta) ? secondSta = tempSta.expression : secondSta = tempSta;
}
*/
// 先取出函数体中的第一条语句 并且定义一个计数器i 初始值为1 接着对函数体中的其他语句进行循环 取出来的语句先赋值给tempSta 然后判断是否为ExpressionStatement
// 节点 如果是 就取出expression属性赋值给secondSta 否则就直接赋值给secondSta


// 接着要把这两个语句改为逗号表达式 可以使用toSequenceExpression来完成 对于不同的语句 需要使用不同的处理方案 这里之处理其中的赋值语句和函数调用语句
// 以及返回语句
/*
if (t.isReturnStatement(secondSta)){
    firstSta = t.returnStatement(
        // 如果第二条语句是返回语句 就取出返回返回语句的右边部分 与 第一条语句进行拼接 等同于 a = 100; return a; ====> return a=100, a;
        t.toSequenceExpression([firstSta, secondSta.argument])
    );
    //处理赋值语句
}else if (t.isAssignmentExpression(secondSta)){
    // a = 100, b = 200; =====> b = a = 100, 200;
    secondSta.right = t.toSequenceExpression([firstSta, secondSta.right]);
    firstSta = secondSta;
}else{
    // a = 100, c(a) =====> a = 100, c(a);
    firstSta = t.toSequenceExpression([firstSta, secondSta]);
}
*/
// 判断语句如果是赋值表达式 就取出其中的right节点 与firstSta组成逗号表达式后 再替换原有的right节点 最后把secondSta赋值给firstSta 进行后续的语句处理
// 再来看返回语句 取出其中argument节点 与firstSta组成逗号表达式后 重新生成一个returnStatement节点 其实到这一步就可以跳出循环了 后续即使再有语句 也不会被执行到了
// 如果既不是返回语句也不是赋值语句 那么就直接firstSta与secondSta组成逗号表达式 也就是最没有混淆力度的组成方式


// 最后再处理函数调用表达式 str.replace(...)就可以处理成(firstSta, str).replace(...)或者(firstSta, str.replace)(...)
/*
if (t.isCallExpression(secondSta.right)){
    let callee = secondSta.right.caller;
    calle.object = t.toSequenceExpression([firstSta, callee.object]);
    firstSta = secondSta;
}
*/
// 上述代码处理的是赋值语句的右边是函数调用表达式的情况 取出函数名callee 对于str.replace(...)来说 就是str.replace部分 就是一个MemberExpression节点
// 取出object部分 即str与firstSta组成逗号表达式 再替换原先的object节点即可


// 完整代码
visitor2 = {
    FunctionExpression(path) {
        let blockStatement = path.node.body;
        let blockStatementLength = blockStatement.body.length;
        if (blockStatementLength < 2) return;
        //把所有声明的变量提取到参数列表中
        path.traverse({
            VariableDeclaration(p) {
                declarations = p.node.declarations;
                let statements = [];
                declarations.map(function (v) {
                    path.node.params.push(v.id);
                    v.init && statements.push(t.assignmentExpression('=', v.id, v.init));
                });
                p.replaceInline(statements);
            }
        });
        //处理赋值语句 返回语句 函数调用语句
        let firstSta = blockStatement.body[0],
            i = 1;
        while (i < blockStatementLength) {
            let tempSta = blockStatement.body[i++];
            t.isExpressionStatement(tempSta) ?
                secondSta = tempSta.expression : secondSta = tempSta;
            //处理返回语句
            if (t.isReturnStatement(secondSta)) {
                firstSta = t.returnStatement(
                    t.toSequenceExpression([firstSta, secondSta.argument]));
                //处理赋值语句
            } else if (t.isAssignmentExpression(secondSta)) {
                if (t.isCallExpression(secondSta.right)) {
                    let callee = secondSta.right.callee;
                    callee.object = t.toSequenceExpression([firstSta, callee.object]);
                    firstSta = secondSta;
                } else {
                    secondSta.right = t.toSequenceExpression([firstSta, secondSta.right]);
                    firstSta = secondSta;
                }
            } else {
                firstSta = t.toSequenceExpression([firstSta, secondSta]);
            }
        }
        path.get('body').replaceWith(t.blockStatement([firstSta]));
    }
}

traverse(ast, visitor2)
let code = generator(ast).code;
console.log(code);
// fs.writeFile('./AST之babel常用api/demoNew.js', code, (err)=>{});
