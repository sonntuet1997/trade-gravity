import React, {useState} from 'react'

import {Row, Col, Form, Tag} from 'antd'

import {
  Header,
  Main,
  Cards,
  Footer,
  Button,
  Card,
  Input,
  Checkbox,
  InputNumber,
  InputSearch,
  InputTextArea,
  Select,
  Option
} from '@components'

import { I18NExample } from '@components/examples/translate'

import { TFunction } from 'next-i18next'

import Counter from '@components/examples/counter'

import { withTranslation, i18n } from '@i18n'
import axios from "axios";
import {CheckCircleOutlined, CloseCircleOutlined} from "@ant-design/icons";

const Home: React.FC<{ t: TFunction }> = ({ t }) => {
  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 8 },
  };
  const tailLayout = {
    wrapperCol: { offset: 8, span: 8 },
  };
  const onFinish = async (values: any) => {
    console.log('Success:', values);
    setLoading(true);
    axios.get('/api/sentence',{
      params: values
    }).then(res =>{
      setLoading(false);
      setData(res.data)
      console.log(res);
    }).catch(error =>{
      setLoading(false);
      setData({});
    })
  };
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      {/*<Header />*/}

      {/*<I18NExample />*/}


      <Form
          {...layout}
          name="basic"
          initialValues={{ embedding: 'bert'}}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
      >
        <Form.Item name="sentence" label="sentence" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="embedding" label="embedding" rules={[{ required: true }]}>
          <Select
              defaultValue={"bert"}
              placeholder="Select an embedding"
              // onChange={this.onGenderChange}
              // allowClear
          >
            <Option value="bert">bert</Option>
            <Option value="glove">glove</Option>
            <Option value="word2vec">word2vec</Option>
          </Select>
        </Form.Item>
        <Form.Item {...tailLayout}>
          {data?.result === 'OFF' && <Tag icon={<CloseCircleOutlined />} color="error">
            offensive
          </Tag>}
          {data?.result === 'NOT' &&  <Tag icon={<CheckCircleOutlined />} color="success">
            non-offensive
          </Tag>}
        </Form.Item>
        <Form.Item {...tailLayout}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
      {/*<Row style={{ margin: '10px 8px' }}>*/}
      {/*  <InputNumber className='atn-input-number-custom'></InputNumber>*/}
      {/*</Row>*/}

      {/*<Row style={{ margin: '10px 8px' }}>*/}
      {/*  <InputSearch className='atn-search-input-custom'></InputSearch>*/}
      {/*</Row>*/}

      {/*<Row style={{ margin: '10px 8px' }}>*/}
      {/*  <InputTextArea className='atn-input-textarea-custom'></InputTextArea>*/}
      {/*</Row>*/}

      {/*<Row style={{ margin: '10px 8px' }}>*/}
      {/*  <Select*/}
      {/*    className='atn-select-custom custom-dropdown'*/}
      {/*    style={{ width: '500px' }}*/}
      {/*  >*/}
      {/*    {' '}*/}
      {/*    {Array.from(Array(5).keys()).map(number => (*/}
      {/*      <Option*/}
      {/*        key={number}*/}
      {/*        value={number}*/}
      {/*      >{`${t`common:number`} ${number}`}</Option>*/}
      {/*    ))}*/}
      {/*  </Select>*/}
      {/*</Row>*/}

      {/*<Row style={{ margin: '10px 8px' }}>*/}
      {/*  <Button size='large' className='atn-btn-sm-custom atn-btn-color-black'>*/}
      {/*    {t`common:button`}*/}
      {/*  </Button>*/}

      {/*  <Button size='small' className='atn-btn-sm-custom atn-btn-color-red'>*/}
      {/*    {t`common:button`}*/}
      {/*  </Button>*/}
      {/*</Row>*/}

      {/* <Counter /> */}

      {/*<Footer />*/}
    </div>
  )
}

export default withTranslation(['home', 'common'])(Home)
