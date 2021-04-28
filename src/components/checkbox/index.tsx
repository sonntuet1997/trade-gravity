import { Checkbox as BaseCheckbox } from 'antd'
import React from 'react'
import { CheckboxProps } from 'antd/lib/checkbox'

export type ICheckbox = CheckboxProps

export const Checkbox: React.FC<ICheckbox> = ({ ...rest }) => {
  return <BaseCheckbox {...rest} />
}
