import styles from './index.css';
import { Modal, Form, Button, Select, Input, Tabs, InputNumber } from 'antd';
import React from "react"

// 定义共同选项
const { Option } = Select;

const { TabPane } = Tabs;

// 定义常量
const constant = {
  buyFirst: 1, // 手套
  buySecond: 2, // 二套

  houseNormal: 1, // 普通住宅
  houseNotNormal: 2, // 非普通住宅

  rightGoods: 1, // 商品房子
  rightBuyPublic: 2, // 已购公租房
  rightTwoCheap: 3, // 二类经适房
  rightOneCheap1: 4, // 一类经适房（10%）
  rightOneCheap2: 5, // 一类经适房（差额70%）
  rightLimit: 6, // 两限房（差额35%）

  yearFullFiveUnique: 1, // 满五唯一
  yearFullTwo: 2, // 满两年
  yearAlmostTwo: 3, // 不满两年

  areaMid: 90, // 面积分界点
}


// 定义转换函数
var transFunc = {
  floatToInt: function (val) {
    return parseInt(val * 100)
  },
  intToFloat: function (val) {
    return parseFloat(val / 100)
  },
}

var cal = {
  // 是否大于90平米
  isOver90: function(values) {
    if (values.area > constant.areaMid) {
      return true
    }
    return false
  },
  // 是否有原值
  hasOrigin: function(values) {
    if (values.origin == 0) {
      return false
    }
    return true
  },
  formatMoney: function(val) {
    return transFunc.intToFloat(transFunc.floatToInt(val))
  },
  formatArea: function(val) {
    return transFunc.intToFloat(transFunc.floatToInt(val))
  },
  // 契税
  deed: function (values) {
    var rate = 0
    // 二套不看面积
    if (values.buy == constant.buySecond) {
      rate = 0.03
    } else if (values.buy == constant.buyFirst) {
      rate = 0.01
      if (this.isOver90(values)) {
        rate = 0.015
      }
    }
    return this.formatMoney(values.net * rate)
  },
  // 个税
  income: function(values) {
    var res = 0
    // 满五唯一免征,其他征收
    if (values.year != constant.yearFullFiveUnique) {
      if (this.hasOrigin(values)) {
        var addVal = this.added(values)
        // 有原值 （网签 - 增值税 - 网签价格*0.1 - 原值*0.01）* 0.2
        res = (values.net - addVal - values.origin - (values.net * 0.1) - values.origin * 0.01) * 0.2
      } else {
        // 无原值
        res = values.net * 0.01
      }
    }
    return this.formatMoney(res)
  },
  // 增值税
  added: function(values) {
    var res = 0
    // 满五唯一，满两年 
    if (values.year == constant.yearFullFiveUnique || values.year == constant.yearFullTwo) {
      // 普通住宅 免征
      if (values.house == constant.houseNormal) {
        res = 0
      } else {
        res = (values.net - values.origin) * 0.056
      }
    } else {
      // 不满两年
      res = values.net * 0.056
    }
    return this.formatMoney(res)
  },
  other: function(values) {
    var res = 0
    // 商品房
    if (values.right == constant.rightGoods) {
      res = 0
    } else if (values.right == constant.rightBuyPublic) {
      // 已购公租房
      res = (values.area * 15.6) * 0.0001
    } else if (values.right == constant.rightTwoCheap) {
      // 二类经适房
      res = values.net * 0.03
    } else if (values.right == constant.rightOneCheap1) {
      // 一类经适房（10%）
      res = values.net * 0.1
    } else if (values.right == constant.rightOneCheap2) {
      // 一类经适房（差额70%）
      res = (values.net-values.origin) * 0.7
    } else if (values.right == constant.rightLimit) {
      // 两限房
      res = (values.net-values.origin) * 0.35
    }  
    return this.formatMoney(res)
  },
  loan: function(values) {
    var res = 0
    if (values.buy == constant.buyFirst) {
      // 普通住宅
      if (values.house == constant.houseNormal) {
        res = values.net * 0.65
      } else {
        res = values.net * 0.6
      }
    } else if (values.buy == constant.buySecond) {
      // 普通住宅
      if (values.house == constant.houseNormal) {
        res = values.net * 0.4
      } else {
        res = values.net * 0.2
      }
    }

    return this.formatMoney(res)
  }
}

class App extends React.Component {
  formRef = React.createRef();
  constructor(props) {
    super(props);
  };
  state = {
    isModalVisible: false,
    result: {
      deed: 0,
      added: 0,
      income:0,
      other:0,
      total:0,
      totalAmount:0,
    }
  }
  submit = (values) => {
    values.deal = Number(values.deal)
    values.net = Number(values.net)
    values.origin = Number(values.origin)
    values.area = Number(values.area)

    var deed = cal.deed(values)
    var added = cal.added(values)
    var income = cal.income(values)
    var other = cal.other(values)
    // 贷款金额
    var loan = cal.loan(values)
    var total = deed + added + income + other
    var totalAmount = total + values.deal
    Modal.info({
      title: '计算结果',
      content: (
        <div>
          <p>契税: {deed}</p>
          <p>增值税：{added}</p>
          <p>个税：{income}</p>
          <p>其他: {other}</p>
          <p>总计：{cal.formatMoney(total)}</p>
          <p>总房款（不含中介费）：{cal.formatMoney(totalAmount)}</p>
          <p>贷款金额：{loan}</p>
          <p>首付款：{cal.formatMoney(totalAmount-loan)}</p>
        </div>
      ),
      onOk() {},
      okText: "关闭"
    });
  }
  close = () => {
    this.setState({isModalVisible:false})
  }
  open = () => {
    this.setState({isModalVisible:true})
  }
  render() {
    return (
      <div>
        <Tabs defaultActiveKey="1" centered>
          <TabPane tab="房款计算器" key="1">
            <Form ref={this.formRef} onFinish={this.submit} initialValues={{
              buy: constant.buyFirst,
              house: constant.houseNormal,
              right: constant.rightGoods,
              year: constant.yearFullFiveUnique,
              deal: "",
              net: "",
              origin: "",
              area: "",
            }} labelCol={{span:4, offset: 1, flex:"0 0 20%"}} wrapperCol={{span:14, flex:"0 0 70%"}}>
              <Form.Item name="buy" label="套数">
                <Select>
                  <Option value={constant.buyFirst}>首套</Option>
                  <Option value={constant.buySecond}>二套</Option>
                </Select>
              </Form.Item>
              <Form.Item name="house" label="住宅类型">
                <Select>
                  <Option value={constant.houseNormal}>普通住宅</Option>
                  <Option value={constant.houseNotNormal}>非普通住宅</Option>
                </Select>
              </Form.Item>
              <Form.Item name="right" label="产权性质">
                <Select>
                  <Option value={constant.rightGoods}>商品房</Option>
                  <Option value={constant.rightBuyPublic}>已购公租房</Option>
                  <Option value={constant.rightTwoCheap}>二类经适房</Option>
                  <Option value={constant.rightOneCheap1}>一类经适房（10%）</Option>
                  <Option value={constant.rightOneCheap2}>一类经适房（差额70%）</Option>
                  <Option value={constant.rightLimit}>两限房（差额35%）</Option>
                </Select>
              </Form.Item>
              <Form.Item name="year" label="产权年限">
                <Select defaultValue={constant.yearFullFiveUnique}>
                  <Option value={constant.yearFullFiveUnique}>满五唯一</Option>
                  <Option value={constant.yearFullTwo}>满两年</Option>
                  <Option value={constant.yearAlmostTwo}>不满两年</Option>
                </Select>
              </Form.Item>
              <Form.Item name="deal" label="成交价格">
                <InputNumber placeholder="成交价格" step={0.1} addonAfter="万元" style={{ width: '100%' }}/>
              </Form.Item>
              <Form.Item name="net" label="网签价格">
                <InputNumber placeholder="网签价格" step={0.1} addonAfter="万元" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="origin" label="原值">
                <InputNumber placeholder="原值" addonAfter="万元" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="area" label="面积">
                <InputNumber placeholder="面积" addonAfter="平米" style={{ width: '100%' }}/>
              </Form.Item>
              <Form.Item wrapperCol={{span:24, flex:"0 0 100%"}}>
                <Button type="primary" htmlType="submit" onClick={this.open}>开始计算</Button>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="计算器002" key="2">
            敬请期待
          </TabPane>
          <TabPane tab="计算器003" key="3">
            敬请期待
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

export default App