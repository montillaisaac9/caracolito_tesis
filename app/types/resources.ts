 /* model Resource {
  id          String    @id @default(cuid())
  title       String
  type        ResourceType
  url         String?
  content     String?   @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum ResourceType {
  DOCUMENT
  VIDEO
  LINK
  IMAGE
}


*/


export interface ResourceType {
    id?:string,
    title:string,
    type:"DOCUMENT" | "VIDEO" | "LINK" | "IMAGE" ,
    url:string,
    content:string
}
