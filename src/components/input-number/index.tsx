import { InputNumber as BaseInputNumber } from 'antd'
import React from 'react'
import { InputNumberProps } from 'antd/lib/input-number'

export type IInputNumber = InputNumberProps

export const InputNumber: React.FC<IInputNumber> = ({ ...rest }) => {
  return <BaseInputNumber {...rest} />
}
