const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generator = require("@babel/generator").default;
const fs = require('fs');

var jscode = fs.readFileSync('E:\\个人\\ast_study\\demo\\while_switch_demo.js', {
    encoding: "utf-8"
});
// 将源代码解析成ast对象，可直接理解成JS的对象来操作
var ast = parser.parse(jscode);

const traverse_newWhile = {
    FunctionExpression(path){
        function seek_while(control_value, control_operator, stop_value){
            let res_list = [];
            while(eval(control_value + control_operator + stop_value)){
                if (main_body[control_value-1].test.value !== control_value) break; // 寻找目标的case

                let case_body = main_body[control_value-1].consequent;

                for (let item of case_body){
                    if (t.isExpressionStatement(item) && t.isAssignmentExpression(item.expression) && t.isIdentifier(item.expression.left, {name: control_name})){ //遇到改变index的代码
                        if (t.isNumericLiteral(item.expression.right)){ //直接改变index，例如cW = 0;
                            control_value = item.expression.right.value;
                            continue;
                        }
                        else if (t.isConditionalExpression(item.expression.right)){ //产生while并改变index，例如cW = d0 < cU ? 7 : 3;
                            let {test, consequent, alternate} = item.expression.right;
                            if (t.isUpdateExpression(res_list[res_list.length-1].expression) && test.left.name === res_list[res_list.length-1].expression.argument.name){
                                return res_list
                            }
                            let body_block = t.BlockStatement(seek_while(consequent.value, control_operator, stop_value));
                            res_list.push(t.whileStatement(test, body_block));
                            control_value = alternate.value;
                            continue;
                        }
                    }
                    else if (t.isBreakStatement(item)) continue; // 遇到break则不管
                    res_list.push(item); //其余代码则放入res_list
                }
            }
            return res_list
        }

        let {body} = path.node;
        if (body.body.length !== 2 || !t.isVariableDeclaration(body.body[0]) || !t.isWhileStatement(body.body[1])) return;
        if (body.body[0].declarations.length !== 1 || !t.isVariableDeclarator(body.body[0].declarations[0])) return;
        let {id, init} = body.body[0].declarations[0];
        let control_name = id.name, control_value = init.value;

        if (!t.isIdentifier(body.body[1].test.left, {name: control_name}) || !t.isSwitchStatement(body.body[1].body.body[0].body[0])) return;
        let main_body = body.body[1].body.body[0].body[0].cases;

        let ans = seek_while(control_value, body.body[1].test.operator, body.body[1].test.right.value);
        path.node.body.body = ans;
    },
}

traverse(ast, traverse_newWhile);
let code = generator(ast).code;
console.log(code);