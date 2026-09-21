export interface ApiResponse<T> {
  code: string
  data: T
  message: string
}