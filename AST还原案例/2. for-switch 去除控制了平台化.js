function getLastConsequent(consequents)
{
    let len = consequents.length;
    if (t.isBreakStatement(consequents[len-1]))
    {
        consequents.pop();
    }
    return consequents;
}

function switchRecursion(cases, switchNodes){
    for (let i = 0; i < cases.length;i++)
    {
        let consequent = cases[i].consequent;
        if (t.isSwitchStatement(consequent[0]))
        {
            switchNodes[i] = [];
            let secondCases = consequent[0].cases;
            switchRecursion(secondCases, switchNodes[i] = []);
        }
        else
        {
            switchNodes[i] = getLastConsequent(consequent);
        }
    }
    return switchNodes;
}

function getSwitchNodes(scope,name)
{
    let switchNodes = [];
    scope.traverse(scope.block,{
        SwitchStatement({node})
        {
            let {discriminant,cases} = node;
            if (discriminant.name !== name) return;
            let caseResults = switchRecursion(cases, switchNodes);
            console.log(caseResults);
        },
    })

    return switchNodes;
}

const traverseFor = {
    ForStatement(path){
        let {init,test,body} = path.node;
        if (!t.isVariableDeclaration(init)) return;
        if (!body.body || body.body.length !== 2) return;
        if (init.declarations.length !== 1) return;
        let initName = init.declarations[0].id.name;
        let initValue = init.declarations[0].init.value;
        switchNodes = getSwitchNodes(path.scope,initName);
        // 接下来根据具体代码记录switch循环case的变化过程, 然后以此从switchNodes中去除生成新的代码
    },
}


traverse(ast,traverseFor);
