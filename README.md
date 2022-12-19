# Prisma Class Validator Gen

[![npm version](https://badge.fury.io/js/prisma-class-validator-gen.svg)](https://badge.fury.io/js/prisma-class-validator-gen)
[![npm](https://img.shields.io/npm/dt/prisma-class-validator-gen.svg)](https://www.npmjs.com/package/prisma-class-validator-gen)
[![HitCount](https://hits.dwyl.com/rhzs/prisma-class-validator-gen.svg?style=flat)](http://hits.dwyl.com/rhzs/prisma-class-validator-gen)
[![npm](https://img.shields.io/npm/l/prisma-class-validator-gen.svg)](LICENSE)

Automatically generate typescript models of your database with class validator validations ready, from your [Prisma](https://github.com/prisma/prisma) Schema. Updates every time `npx prisma generate` runs.

<p align="center">
  <a href="https://www.buymeacoffee.com/omardulaimi">
    <img src="https://cdn.buymeacoffee.com/buttons/default-black.png" alt="Buy Me A Coffee" height="41" width="174">
  </a>
</p>

## Table of Contents

- [Supported Prisma Versions](#supported-prisma-versions)
- [Installation](#installing)
- [Usage](#usage)
- [Additional Options](#additional-options)

# Supported Prisma Versions

Probably no breaking changes for this library, so try newer versions first.

### Prisma 4

- 0.2.0 and higher

### Prisma 2/3

- 0.1.1 and lower

## Installation

Using npm:

```bash
 npm install prisma-class-validator-generator
```

Using yarn:

```bash
 yarn add prisma-class-validator-generator
```

# Usage

1- Star this repo 😉

2- Add the generator to your Prisma schema

```prisma
generator class_validator {
  provider = "prisma-class-validator-generator"
  output   = "./class-validator-gen"
}
```

3- Running `npx prisma generate` for the following schema.prisma

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title     String
  content   String?
  published Boolean  @default(false)
  viewCount Int      @default(0)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
  rating    Float
}
```

will generate the following files

![Typescript models with class validator](https://raw.githubusercontent.com/rhzs/prisma-class-validator-gen/master/classValidatorModels.png)

Inside `User` model:

```ts
import { IsInt, IsDefined, IsString, IsOptional } from "class-validator";
import { Post } from "./";

export class User {
    @IsDefined()
    @IsInt()
    id!: number;

    @IsDefined()
    @IsString()
    email!: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsDefined()
    posts!: Post[];
}

```

## Additional Options

| Option   |  Description                              | Type     |  Default      |
| -------- | ----------------------------------------- | -------- | ------------- |
| `output` | Output directory for the generated models and enums | `string` | `./generated` |
| `modelDir` | Model directory name for the generated models | `string` | `./generated/models` |
| `enumDir` | Enum directory name for the generated enums | `string` | `./generated/enums` |

Use additional options in the `schema.prisma`

```prisma
generator class_validator {
  provider   = "prisma-class-validator-generator"
  output     = "./generated"
  modelDir = "models"
  enumDir  = "enums"
}
```
