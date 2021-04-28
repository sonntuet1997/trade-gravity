import React from 'react'

import { Row, Col } from 'antd'

import {
  Header,
  Main,
  Cards,
  Footer,
  Button,
  Card,
  Checkbox,
  Input,
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

const Home: React.FC<{ t: TFunction }> = ({ t }) => {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <Header />

      <I18NExample />

      <Row style={{ margin: '10px 8px' }}>
        {' '}
        <Checkbox className='atn-checkbox-custom'></Checkbox>
      </Row>

      <Row style={{ margin: '10px 8px' }}>
        <Input className='atn-input-custom'></Input>
      </Row>

      <Row style={{ margin: '10px 8px' }}>
        <InputNumber className='atn-input-number-custom'></InputNumber>
      </Row>

      <Row style={{ margin: '10px 8px' }}>
        <InputSearch className='atn-search-input-custom'></InputSearch>
      </Row>

      <Row style={{ margin: '10px 8px' }}>
        <InputTextArea className='atn-input-textarea-custom'></InputTextArea>
      </Row>

      <Row style={{ margin: '10px 8px' }}>
        <Select
          className='atn-select-custom custom-dropdown'
          style={{ width: '500px' }}
        >
          {' '}
          {Array.from(Array(5).keys()).map(number => (
            <Option
              key={number}
              value={number}
            >{`${t`common:number`} ${number}`}</Option>
          ))}
        </Select>
      </Row>

      <Row style={{ margin: '10px 8px' }}>
        <Button size='large' className='atn-btn-sm-custom atn-btn-color-black'>
          {t`common:button`}
        </Button>

        <Button size='small' className='atn-btn-sm-custom atn-btn-color-red'>
          {t`common:button`}
        </Button>
      </Row>

      {/* <Counter /> */}

      <Footer />
    </div>
  )
}

export default withTranslation(['home', 'common'])(Home)
