import { Input } from 'antd'
const { TextArea } = Input
import React from 'react'
import { TextAreaProps } from 'antd/lib/input/TextArea'

export type IInputTextArea = TextAreaProps

export const InputTextArea: React.FC<IInputTextArea> = ({ ...rest }) => {
  return <TextArea {...rest} />
}
