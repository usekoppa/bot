# Koppa ~ WIP

Koppa's your all-purpose Discord multi-tool 🛠

*Reinventing the wheel in order to create the round square.*

## Development

Some things you ought to know for development:
 - Koppa uses a principle of grouping things by their role in the business logic instead of by technical roles
   e.g. using plugins instead of a commands folder and events folder
 - Koppa uses plugins to ensure modularity and extensibility for users.
 - We try and separate complex logic and feature creation as much as possible by making most of the
   directly interacted with user features like plugins in the `src` directory and the libraries that
   power this in the `lib` directory. 
    - Consider the following as the best rule of thumb:
      - An experience that a user can interact with or code that is inter-dependent -> `src`
      - A tool or framework, -> `lib`
