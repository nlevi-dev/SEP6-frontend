import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Movie, MovieSearchResult, QueryParameters} from 'src/app/shared/models/movie';
import {MoviesService} from 'src/app/shared/services/movies.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  public searchForm = this.formBuilder.group({
    search: new FormControl('', [Validators.required]),
    year: new FormControl(''),
  });
  public movies: any;
  public page: number = 1;
  public total: number = 0;
  public searchParam: string = '';
  public yearParam: number = 0;
  private subscription: Subscription = new Subscription();

  constructor(
    public router: Router,
    private moviesService: MoviesService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.subscription.add(
    this.route.queryParams.subscribe((params) => {
      if (!params['search']) {
        this.searchForm.patchValue({search: '', year: ''});

        if (params['page']) {
          this.page = params['page'];
          this.fetchPopularMovies(params['page']);

        } else {
          this.fetchPopularMovies(1);
        }
      } else {
        this.searchParam = params['search'];
        this.searchForm.patchValue({search: this.searchParam});
        if (params['year']) {
          this.yearParam = params['year'];
          this.searchForm.patchValue({year: this.yearParam});
          this.moviesService
            .searchForMovies(params['search'], params['year'], params['page'])
            .then((data: MovieSearchResult) => {
              if (data) {
                this.setResultsFromData(data);
              }
            });
        } else {
          this.moviesService
            .searchForMovies(params['search'], undefined, params['page'])
            .then((data: MovieSearchResult) => {
              if (data) {
                this.setResultsFromData(data);
              }
            });
        }
      }
    }));
  }

  private setResultsFromData(data: MovieSearchResult) {
    this.movies = data.results;
    this.total = data.total_results;
    this.page = data.page;
    //api doesn't support more than 500 pages
    if (this.total > 10000) {
      this.total = 10000;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public routeToMovie(movie: Movie): void {
    this.moviesService.setSelectedMovie(movie);
    this.router.navigateByUrl(`/movies/${movie.id}`);
  }

  public search(): void {
    let queryParams: QueryParameters;
    if (this.searchForm.value.search === '') {
      this.router.navigate([]);
      this.fetchPopularMovies(1);
    } else {
      if (this.searchForm.value.year === '') {
        queryParams = {
          search: this.searchForm.value.search,
          page: 1,
        };
      } else {
        queryParams = {
          search: this.searchForm.value.search,
          year: this.searchForm.value.year,
          page: 1,
        };
      }
      this.router.navigate([], {relativeTo: this.route, queryParams});
      this.moviesService
        .searchForMovies(
          this.searchForm.value.search,
          this.searchForm.value.year
        )
        .then((data) => {
          if (data) {
            this.setResultsFromData(data);
          }
        });
    }
  }

  public fetchPopularMovies(page: number): void {
    this.moviesService.getPopularMovies(page).then((data: MovieSearchResult) => {
      this.setResultsFromData(data);
    });
  }

  public handlePageChange(event: any): void {
    let queryParams: QueryParameters;
    if (this.searchParam !== '') {
      if (this.route.snapshot.queryParams['year']) {
        queryParams = {
          search: this.searchParam,
          year: this.route.snapshot.queryParams['year'],
          page: event,
        };
      } else {
        queryParams = {
          search: this.searchParam,
          page: event,
        };
      }
      this.moviesService
        .searchForMovies(this.searchParam, this.yearParam, event)
        .then((data: MovieSearchResult) => {
          if (data) {
            this.setResultsFromData(data);
            this.router.navigate([], {relativeTo: this.route, queryParams});
          }
        });
    } else {
      queryParams = {
        page: event,
      };
      this.router.navigate([], {relativeTo: this.route, queryParams})
      this.fetchPopularMovies(this.page);

    }
  }
}
