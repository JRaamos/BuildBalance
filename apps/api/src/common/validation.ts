import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsMoneyString(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isMoneyString',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && /^\d{1,12}(\.\d{1,2})?$/.test(value) && Number(value) > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} deve ser um valor monetário positivo com até duas casas decimais`;
        }
      }
    });
  };
}
