import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class ReferenceParamDto {
  @ApiProperty({ example: 'P-8T6NZ7', description: 'The pledge reference the donor shows' })
  @Matches(/^[Pp]-[A-Za-z0-9]{4,12}$/, { message: 'invalid_reference' })
  referenceNo: string;
}
