export interface ApiServiceStatus {
  name: string
  configured: boolean
}

export interface ApiStatusResponse {
  services: ApiServiceStatus[]
  redis: {
    connected: boolean
  }
}
