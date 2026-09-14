export const skills=[
 {id:'demand',name:'市场与需求',short:'需求',description:'区分价格变化、需求移动与市场条件',resources:['K006','K009','K010','K012']},
 {id:'pricing',name:'定价与弹性',short:'定价',description:'用弹性解释价格、销量和收入的关系',resources:['K018','K019','K022','K024']},
 {id:'cost',name:'成本与利润',short:'成本',description:'计算贡献毛益、利润与保本销量',resources:['K023','K038','K043','K044']},
 {id:'analysis',name:'数据与决策',short:'分析',description:'识别机会成本、假设与因果边界',resources:['K001','K003','K014','K063']},
 {id:'operations',name:'运营与履约',short:'运营',description:'把需求方案与产能、交付和报告相连',resources:['K035','K065','K037','K062']},
 {id:'ethics',name:'商业伦理',short:'伦理',description:'理解竞争激励、信息与外部影响',resources:['K053','K054','K057','K059']}
];
export const questions=[
 {id:'q1',skill:'demand',text:'短视频走红后，同一价格下订单增加，最合适的解释是？',options:['沿原需求曲线移动','需求曲线可能向右移动','供给一定减少'],answer:1,explanation:'关注度是非价格因素，可能改变各个价格下的需求；仍需核实同期其他因素。',knowledgeId:'K010'},
 {id:'q2',skill:'pricing',text:'用中点法计算：价格100元降到90元，销量100件升到120件，弹性绝对值约为？',options:['0.58','1.00','1.73'],answer:2,explanation:'(20/110)÷(10/95)≈1.73。',knowledgeId:'K019'},
 {id:'q3',skill:'cost',text:'单价100元、单位变动成本60元、固定成本10000元，卖出1000件，模型利润为？',options:['30000元','40000元','100000元'],answer:0,explanation:'(100−60)×1000−10000=30000元。',knowledgeId:'K043'},
 {id:'q4',skill:'analysis',text:'广告费已经支付且不可退，追加投放时应重点比较？',options:['已经花的钱越多越要追加','新增收益与新增成本','竞争对手的投放总额'],answer:1,explanation:'不可收回的支出是沉没成本，当前增量决策应关注未来可变部分。',knowledgeId:'K051'},
 {id:'q5',skill:'operations',text:'模型需求1500件，实际可交付库存只有1000件，本期可实现销量最多是？',options:['1500件','1250件','1000件'],answer:2,explanation:'本Demo不接受超卖和延期交付，实际销量受可交付容量约束。',knowledgeId:'K065'},
 {id:'q6',skill:'ethics',text:'双方合作各得3、双方背叛各得1，单方背叛者得5、被背叛者得0。只计自身收益的单轮占优策略是？',options:['背叛','合作','无法判断'],answer:0,explanation:'对手合作时5>3；对手背叛时1>0，因此背叛是严格占优策略。',knowledgeId:'K053'}
];
export const scenarios={
 promotion:{title:'一场降价促销，真的更赚钱吗？',short:'促销定价',brief:'一家教学模拟店铺准备促销。同款商品日常售价100元，基准销量1000件。请比较促销前后收入与利润，给出有依据的活动建议。',steps:['确认基准价格、销量、成本和统计周期。','设置促销价格及需求弹性，观察销量和利润变化。','检查库存上限与保本销量，比较至少两个方案。','写出建议、计算依据和一个需要真实数据验证的假设。'],sources:['elasticity','revenue','costs']},
 inventory:{title:'活动爆单前，先算清交付能力。',short:'库存约束',brief:'教学模拟店铺仅能在承诺期内交付1100件商品。营销希望通过降价扩大销量，请评估库存约束对利润和促销判断的影响。',steps:['将可交付库存设置为1100件，统一分析周期。','分别比较80元与100元售价下的预估需求。','区分潜在需求与可实现销量，识别截断位置。','提交促销与备货建议，并说明需求估计的不确定性。'],sources:['production','costs','standard']},
 margin:{title:'销售额增加了，利润为什么下降？',short:'经营复盘',brief:'同一家教学模拟店铺考虑降价。经营复盘要求把价格、销量、变动成本和固定成本拆开，避免用销售额代替利润。',steps:['记录基准方案的收入、总成本和利润。','设置80元促销价，保留同一成本和需求假设。','分解售价变化与销量变化对利润的共同影响。','给出经营复盘结论，并列出模型尚未覆盖的费用。'],sources:['profit','costs','revenue']}
};
